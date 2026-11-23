import { Response } from 'express';
import {
  createElectionRequest as createElectionRequestService,
  getElectionRequestById as getElectionRequestByIdService,
  getElectionRequests as getElectionRequestsService,
  getElectionRequestsBySociety as getElectionRequestsBySocietyService,
  updateElectionRequestStatus as updateElectionRequestStatusService,
  updateElectionRequest as updateElectionRequestService,
  deleteElectionRequest as deleteElectionRequestService
} from '../services/ElectionRequestService';
import { returnResponse } from '../utils/response';
import { IAuthRequest } from '../types';

export const createElectionRequest = async (req: IAuthRequest, res: Response) => {
  try {
    const {
      society_registration_id,
      last_election_held_date,
      last_elected_committee_expiry_date,
      reason_for_election_request,
      proposed_election_date,
      proposed_venue,
      number_of_members_eligible_to_vote,
      member_list_media_id,
      meeting_resolution_copy_media_id,
      previous_election_report_media_id,
      additional_notes
    } = req.body;

    const userId = req.user?.userId || (req as any).user?.id;

    if (!userId) {
      console.error('No user ID found in request:', {
        reqUser: req.user,
        reqUserAny: (req as any).user,
        userId
      });
      return returnResponse(res).error('Authentication required - no user ID found', []);
    }

    console.log('Creating election request for user:', userId);

    const electionRequest = await createElectionRequestService({
      society_registration_id,
      last_election_held_date: last_election_held_date ? new Date(last_election_held_date) : null,
      last_elected_committee_expiry_date: last_elected_committee_expiry_date ? new Date(last_elected_committee_expiry_date) : null,
      reason_for_election_request,
      proposed_election_date: new Date(proposed_election_date),
      proposed_venue,
      number_of_members_eligible_to_vote: Number(number_of_members_eligible_to_vote),
      member_list_media_id: member_list_media_id || undefined,
      meeting_resolution_copy_media_id: meeting_resolution_copy_media_id || undefined,
      previous_election_report_media_id: previous_election_report_media_id || undefined,
      additional_notes,
      created_by: userId
    });

    // Return response with election request and uploaded media information
    if (electionRequest.success) {
      returnResponse(res).ok('Election request created successfully', electionRequest.data);
    } else {
      returnResponse(res).error(electionRequest.message, []);
    }
  } catch (error: any) {
    console.error('Error creating election request:', error);
    returnResponse(res).error('Failed to create election request', []);
  }
};

/**
 * Get election request by ID
 */
export const getElectionRequestById = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    if (!id) {
      return returnResponse(res).error('Election request ID is required', []);
    }

    const electionRequest = await getElectionRequestByIdService(id);

    if (!electionRequest) {
      return returnResponse(res).error('Election request not found', []);
    }

    returnResponse(res).ok('Election request retrieved successfully', electionRequest);
  } catch (error: any) {
    console.error('Error getting election request by ID:', error);
    returnResponse(res).error('Failed to retrieve election request', []);
  }
};

/**
 * Get all election requests with filters
 */
export const getElectionRequests = async (req: IAuthRequest, res: Response) => {
  try {
    const {
      society_registration_id,
      status_id,
      reason_for_election_request,
      proposed_election_date,
      assigned_officer_id,
      page = 1,
      limit = 10
    } = req.query;

    // Get the authenticated user's ID and district
    const userId = req.user?.userId;
    const userDistrictId = req.user?.district_id;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    const filters = {
      society_registration_id: society_registration_id as string,
      status_id: status_id as string,
      reason_for_election_request: reason_for_election_request as string,
      proposed_election_date: proposed_election_date as string,
      assigned_officer_id: assigned_officer_id as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };
    const search = req.query.search as string;

    // Pass the authenticated user information to the service
    const authenticatedUser = {
      district_id: userDistrictId,
      role: req.user?.role,
      userId: userId
    };

    const result = await getElectionRequestsService(filters, authenticatedUser, search);

    return returnResponse(res).ok('Election requests retrieved successfully', {
      electionRequests: result.electionRequests,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error: any) {
    console.error('Error getting election requests:', error);
    return returnResponse(res).error('Failed to retrieve election requests', []);
  }
};

/**
 * Get election requests by society registration ID
 */
export const getElectionRequestsBySociety = async (req: IAuthRequest, res: Response) => {
  try {
    const { societyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    if (!societyId) {
      return returnResponse(res).error('Society ID is required', []);
    }

    const electionRequests = await getElectionRequestsBySocietyService(societyId);

    return returnResponse(res).ok('Election requests retrieved successfully', electionRequests);
  } catch (error: any) {
    console.error('Error getting election requests by society:', error);
    return returnResponse(res).error('Failed to retrieve election requests by society', []);
  }
};

/**
 * Update election request status
 */
export const updateElectionRequestStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status_id, comments } = req.body;
    const updatedBy = req.user?.userId;

    if (!status_id) {
      return returnResponse(res).error('Status ID is required', []);
    }

    if (!id) {
      return returnResponse(res).error('Election request ID is required', []);
    }

    if (!updatedBy) {
      return returnResponse(res).error('User authentication required', []);
    }

    const result = await updateElectionRequestStatusService(id, status_id, updatedBy, comments);

    if (result.success) {
      return returnResponse(res).ok('Election request status updated successfully', result.data);
    } else {
      return returnResponse(res).error(result.message, []);
    }
  } catch (error: any) {
    console.error('Error updating election request status:', error);
    return returnResponse(res).error('Failed to update election request status', []);
  }
};

/**
 * Update election request
 */
export const updateElectionRequest = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    // Convert date strings to Date objects if they exist
    if (updateData.last_election_held_date) {
      updateData.last_election_held_date = new Date(updateData.last_election_held_date);
    }
    if (updateData.last_elected_committee_expiry_date) {
      updateData.last_elected_committee_expiry_date = new Date(updateData.last_elected_committee_expiry_date);
    }
    if (updateData.proposed_election_date) {
      updateData.proposed_election_date = new Date(updateData.proposed_election_date);
    }

    // Convert numeric fields
    if (updateData.number_of_members_eligible_to_vote) {
      updateData.number_of_members_eligible_to_vote = Number(updateData.number_of_members_eligible_to_vote);
    }

    if (!id) {
      return returnResponse(res).error('Election request ID is required', []);
    }

    const result = await updateElectionRequestService(id, updateData, userId);

    if (result.success) {
      returnResponse(res).ok('Election request updated successfully', result.data);
    } else {
      returnResponse(res).error(result.message, []);
    }
  } catch (error: any) {
    console.error('Error updating election request:', error);
    returnResponse(res).error('Failed to update election request', []);
  }
};

/**
 * Delete election request
 */
export const deleteElectionRequest = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    if (!id) {
      return returnResponse(res).error('Election request ID is required', []);
    }

    const result = await deleteElectionRequestService(id, userId);

    if (result.success) {
      returnResponse(res).ok('Election request deleted successfully', {});
    } else {
      returnResponse(res).error(result.message, []);
    }
  } catch (error: any) {
    console.error('Error deleting election request:', error);
    returnResponse(res).error('Failed to delete election request', []);
  }
};
