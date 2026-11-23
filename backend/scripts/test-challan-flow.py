#!/usr/bin/env python3
"""E2E: challan upload -> RCS return -> applicant re-upload -> RCS assign check."""
import json
import urllib.request
import urllib.error
import os
import sys

BASE = os.environ.get("API_BASE", "http://localhost:3000/api/v1")
APPLICANT = ("vitex87763@gwshare.com", "Abcd@1234")
RCS = ("khushi@gmail.com", "Abcd@1234")


def http(method, path, data=None, token=None, files=None):
    url = BASE + path
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if files:
        import uuid

        boundary = uuid.uuid4().hex
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        parts = []
        for name, (filename, content, ctype) in files.items():
            parts.append(f"--{boundary}\r\n".encode())
            parts.append(
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
            )
            parts.append(f"Content-Type: {ctype}\r\n\r\n".encode())
            parts.append(content)
            parts.append(b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
    elif data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"raw": raw[:1500]}
        return e.code, payload


def login(email, password):
    code, res = http("POST", "/auth/login", {"email": email, "password": password})
    if code != 200 or not res.get("success"):
        raise SystemExit(f"Login failed {email}: {code} {res}")
    return res["data"]["token"], res["data"]["user"]


def wf_status(token, reg_id):
    code, res = http(
        "GET",
        f"/workflows/{reg_id}/status?moduleName=SOCIETY_REGISTRATION",
        token=token,
    )
    if code != 200:
        raise SystemExit(f"workflow status failed: {code} {res}")
    return res["data"]


def summarize(wf, society):
    cur = wf.get("currentWorkflow") or {}
    nxt = wf.get("nextWorkflow") or {}
    print(
        "  status:",
        (society.get("statusDetails") or {}).get("key")
        or wf.get("currentStatus", {}).get("key"),
        "| current seq:",
        cur.get("sequence"),
        "| next seq:",
        nxt.get("sequence"),
        "| assignedToUserId:",
        wf.get("assignedToUserId"),
        "| entity assigned:",
        society.get("assigned_to_user_id"),
    )


def minimal_pdf():
    return b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF"""


def main():
    print("API:", BASE)
    app_tok, app_user = login(*APPLICANT)
    rcs_tok, rcs_user = login(*RCS)
    print("Applicant:", app_user.get("id"), app_user.get("email"))
    print("RCS:", rcs_user.get("id"), rcs_user.get("email"))

    code, me = http("GET", "/me", token=app_tok)
    if code != 200:
        raise SystemExit(f"/me failed: {code} {me}")
    society = (me.get("data") or {}).get("society") or me.get("data", {})
    if not society or not society.get("id"):
        raise SystemExit(f"No society on /me: {me}")
    reg_id = society["id"]
    print("Registration id:", reg_id)

    wf = wf_status(app_tok, reg_id)
    print("BEFORE:")
    summarize(wf, society)

    cur_seq = (wf.get("currentWorkflow") or {}).get("sequence")
    status_key = (society.get("statusDetails") or {}).get("key") or wf.get(
        "currentStatus", {}
    ).get("key")

    # If not on RCS desk (10) with challan uploaded, try to get there via upload
    if not (status_key == "challan_uploaded" and cur_seq == 10):
        print("Uploading challan to reach RCS desk (step 10)...")
        code, up = http(
            "POST",
            f"/society-registrations/{reg_id}/challan",
            token=app_tok,
            files={"challan": ("test-challan.pdf", minimal_pdf(), "application/pdf")},
        )
        print("  upload:", code, up.get("message") if isinstance(up, dict) else up)
        if code not in (200, 201) and not up.get("success"):
            print("  upload body:", json.dumps(up, indent=2)[:800])
        code, me = http("GET", "/me", token=app_tok)
        society = (me.get("data") or {}).get("society") or me.get("data", {})
        wf = wf_status(rcs_tok, reg_id)
        print("AFTER UPLOAD:")
        summarize(wf, society)

    # RCS return (reject at step 10)
    print("RCS reject (challan return)...")
    code, rej = http(
        "POST",
        "/workflows/update",
        {
            "resourceId": reg_id,
            "moduleName": "SOCIETY_REGISTRATION",
            "action": "reject",
            "comments": "E2E test: challan correction required",
        },
        token=rcs_tok,
    )
    print("  reject:", code, rej.get("message") if isinstance(rej, dict) else rej)
    if not rej.get("success") and code >= 400:
        print(json.dumps(rej, indent=2)[:1200])
        # try back
        code, rej = http(
            "POST",
            "/workflows/update",
            {
                "resourceId": reg_id,
                "moduleName": "SOCIETY_REGISTRATION",
                "action": "back",
                "comments": "E2E test: challan correction (back)",
            },
            token=rcs_tok,
        )
        print("  back fallback:", code, rej.get("message"))

    code, me = http("GET", "/me", token=app_tok)
    society = (me.get("data") or {}).get("society") or me.get("data", {})
    wf = wf_status(app_tok, reg_id)
    print("AFTER RCS RETURN:")
    summarize(wf, society)

    print("Applicant re-upload challan...")
    code, up2 = http(
        "POST",
        f"/society-registrations/{reg_id}/challan",
        token=app_tok,
        files={"challan": ("test-challan-reupload.pdf", minimal_pdf(), "application/pdf")},
    )
    print("  re-upload:", code, up2.get("message") if isinstance(up2, dict) else up2)
    if isinstance(up2, dict) and up2.get("data"):
        print("  data:", up2["data"])

    code, me = http("GET", "/me", token=app_tok)
    society = (me.get("data") or {}).get("society") or me.get("data", {})
    wf = wf_status(rcs_tok, reg_id)
    print("AFTER RE-UPLOAD (RCS view):")
    summarize(wf, society)

    rcs_id = rcs_user["id"]
    assigned = wf.get("assignedToUserId") or society.get("assigned_to_user_id")
    cur_seq = (wf.get("currentWorkflow") or {}).get("sequence")
    status_key = wf.get("currentStatus", {}).get("key") or (
        society.get("statusDetails") or {}
    ).get("key")
    ok = (
        status_key == "challan_uploaded"
        and cur_seq == 10
        and assigned
        and str(assigned) == str(rcs_id)
    )
    print("PASS" if ok else "FAIL", "- RCS assigned & desk ready:", ok)
    print("  expected RCS:", rcs_id, "got assigned:", assigned)
    if not ok:
        sys.exit(1)

    print("RCS final approve (step 10)...")
    code, appr = http(
        "POST",
        "/workflows/update",
        {
            "resourceId": reg_id,
            "moduleName": "SOCIETY_REGISTRATION",
            "action": "approve",
            "comments": "E2E test: final approve / certificate issue",
        },
        token=rcs_tok,
    )
    print("  approve:", code, appr.get("message") if isinstance(appr, dict) else appr)
    next_status = (appr.get("data") or {}).get("nextStatus") if isinstance(appr, dict) else None
    print("  nextStatus:", next_status)

    code, me = http("GET", "/me", token=app_tok)
    society = (me.get("data") or {}).get("society") or me.get("data", {})
    wf = wf_status(app_tok, reg_id)
    print("AFTER FINAL APPROVE:")
    summarize(wf, society)

    status_key = (society.get("statusDetails") or {}).get("key") or wf.get(
        "currentStatus", {}
    ).get("key")
    next_status = (appr.get("data") or {}).get("nextStatus") if isinstance(appr, dict) else None
    cert_ok = status_key == "certificate_issued" and next_status == "certificate_issued"
    print("PASS" if cert_ok else "FAIL", "- certificate_issued:", cert_ok)
    if not cert_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
