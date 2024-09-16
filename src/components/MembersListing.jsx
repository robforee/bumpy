// src/components/MembersListing.jsx
"use client";

import Link from "next/link";
import React from "react";

const MemberItem = ({ member }) => (
  <li key={member.id}>
    <Link href={`/member/${member.id}`}>
      <ActiveMember member={member} />
    </Link>
  </li>
);

const ActiveMember = ({ member }) => (
  <div>
    <ImageCover photo={member.photo} name={member.name} />
    <MemberDetails member={member} />
  </div>
);

const ImageCover = ({ photo, name }) => (
  <div className="image-cover">
    <img src={photo || "/default-avatar.png"} alt={name} />
  </div>
);

const MemberDetails = ({ member }) => (
  <div className="member__details">
    <h2>{member.name}</h2>
    <MemberMetadata member={member} />
  </div>
);

const MemberMetadata = ({ member }) => (
  <div className="member__meta">
    <p>{member.role || "Member"} | {member.location || "Unknown Location"}</p>
  </div>
);

export default function MembersListing({ members }) {
  return (
    <article>
      <ul className="members">
        {members.map(member => (
          <MemberItem key={member.id} member={member} />
        ))}
      </ul>
    </article>
  );
}