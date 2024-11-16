"use client";

import type { NextPage } from "next";
import Auctions from "~~/components/Auctions";
import Hero from "~~/components/Hero";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <Hero
        title="CipherBid"
        subtitle="Where Privacy Meets Transparency in Auctions"
        description="CipherBid ensures confidential, secure, and fair auctions powered by blockchain technology."
        buttonText="Get Started"
        onButtonClick={() => {
          console.log("Button clicked");
        }}
      />

      <Auctions />
    </div>
  );
};

export default Home;
