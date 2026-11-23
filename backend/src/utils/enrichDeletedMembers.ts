import Media from '../models/Media';
import logger from '../utils/logger';

/** Attach supporting document media URLs onto deleted_members JSON rows. */
export async function enrichDeletedMembersWithMedia(
  deletedMembers: unknown,
  context: { id: string; module: string }
): Promise<any[]> {
  const list = Array.isArray(deletedMembers) ? deletedMembers : [];
  if (list.length === 0) return list;

  try {
    const mediaIds = list
      .map((item: any) => item?.supporting_document_media_id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

    if (mediaIds.length === 0) return list;

    const mediaRows = await Media.findAll({
      where: { id: mediaIds },
      attributes: ['id', 'url', 'file_name', 'original_name']
    });
    const mediaById = new Map(mediaRows.map((row) => [String(row.id), row.get({ plain: true })]));

    return list.map((item: any) => ({
      ...item,
      supportingDocumentMedia: item?.supporting_document_media_id
        ? mediaById.get(String(item.supporting_document_media_id)) || null
        : null
    }));
  } catch (error: any) {
    logger.warn('Failed to enrich deleted_members media', {
      id: context.id,
      module: context.module,
      error: error?.message
    });
    return list;
  }
}
