import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "InkSpot — Find tattoo artists by style",
  description:
    "Find tattoo artists who match your aesthetic — by image, by feel, by voice. Style-matched, geolocated, anywhere in the world.",
};

export default function LandingPage() {
  return <LandingClient />;
}
