import renderStars from "@/src/components/restaurant/Stars.jsx";
import { userAgentFromString } from "next/server";


export function Review({ rating, text, userName, timestamp }) {
  return (<li className="review__item">
    {/* <ul className="restaurant__rating">{renderStars(rating)}</ul> */}
    <time>
    {userName || 'anon'} &nbsp;~&nbsp;  
    {new Intl.DateTimeFormat("en-US", {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }).format(timestamp)}
    </time>
    <p>{text}</p>
  </li>);
}

export function ReviewSkeleton() {
  return (<li className="review__item">
    <div className="restaurant__rating" ><div style={{height:"2rem", backgroundColor: "rgb(156 163 175)", width: "10rem"}}></div></div>
    <div style={{height:"19px", backgroundColor: "rgb(156 163 175)", width: "12rem"}}></div>
    <p>{'   '}</p>
  </li>);
}
