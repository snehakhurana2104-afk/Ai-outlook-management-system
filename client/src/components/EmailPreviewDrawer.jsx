import React from "react";
import { X, Mail, User, CalendarDays } from "lucide-react";
import "./EmailPreviewDrawer.css";

function EmailPreviewDrawer({
  open,
  email,
  profilePhoto,
  onClose,
  children,
}) {
  if (!open || !email) return null;

  const body =
    email.raw?.body?.content ||
    email.body ||
    email.bodyPreview ||
    "No email content available.";

  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
      />

      <aside className="email-drawer">

        <div className="drawer-header">

          <div className="drawer-user">

            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="drawer-avatar"
              />
            ) : (
              <div className="drawer-avatar initials">
                {email.sender
                  ?.split(" ")
                  .map((x) => x[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div>

              <h2>{email.sender}</h2>

              <p>{email.subject}</p>

            </div>

          </div>

          <button
            className="drawer-close"
            onClick={onClose}
          >
            <X size={22} />
          </button>

        </div>

        <div className="drawer-meta">

          <div>
            <User size={16} />
            <span>{email.sender}</span>
          </div>

          <div>
            <CalendarDays size={16} />
            <span>{email.receivedDate}</span>
          </div>

          <div>
            <Mail size={16} />
            <span>{email.status}</span>
          </div>

        </div>

        {children}

        <div
          className="drawer-body"
          dangerouslySetInnerHTML={{ __html: body }}
        />

      </aside>
    </>
  );
}

export default EmailPreviewDrawer;