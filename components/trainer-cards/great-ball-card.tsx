'use client';

import React, { useState } from 'react';
import { Player } from '@/lib/store';

interface TrainerCardProps {
  player: Player;
}

export function GreatBallCard({ player }: TrainerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (isFlipped) {
    return (
      <div
        onClick={() => setIsFlipped(false)}
        className="w-full aspect-[2.5/3.5] bg-gradient-to-b from-blue-400 to-white rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105 p-4 flex flex-col items-center justify-between relative overflow-hidden"
      >
        {/* Top section - blue gradient with Great Balls */}
        <div className="w-full h-1/2 flex items-center justify-around mb-4 relative">
          {/* Left side red corner accent */}
          <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-red-500 to-transparent opacity-60 rounded-br-lg"></div>
          {/* Right side red corner accent */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-red-500 to-transparent opacity-60 rounded-bl-lg"></div>

          {/* Great Balls on top row */}
          {[0, 1].map((i) => (
            <div key={`top-${i}`} className="flex flex-col items-center">
              {/* Large gray circle - Greatball design */}
              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center border-4 border-gray-500 relative">
                {/* Blue curved section */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-400 rounded-full border-b-2 border-gray-500"></div>
                {/* Center button */}
                <div className="w-5 h-5 bg-gray-300 rounded-full border-2 border-gray-600 z-10"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider line */}
        <div className="w-full h-1 bg-black mb-4"></div>

        {/* Bottom section - white background with Great Balls */}
        <div className="w-full h-1/2 flex items-center justify-between px-4">
          {/* Red vertical accent on left */}
          <div className="absolute left-0 bottom-0 w-1 h-16 bg-red-500"></div>
          {/* Red vertical accent on right */}
          <div className="absolute right-0 bottom-0 w-1 h-16 bg-red-500"></div>

          {/* Great Balls on bottom row */}
          {[0, 1].map((i) => (
            <div key={`bottom-${i}`} className="flex flex-col items-center">
              {/* Small black Pokeball */}
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-gray-800">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  {/* White bottom half */}
                  <div className="absolute w-10 h-5 bg-white bottom-0 rounded-b-full border-b border-gray-400"></div>
                  {/* Center white dot */}
                  <div className="w-3 h-3 bg-white rounded-full z-10"></div>
                </div>
              </div>
            </div>
          ))}

          {/* Left corner brackets */}
          <div className="absolute left-4 bottom-4 flex flex-col gap-1">
            <div className="w-4 h-0.5 bg-red-500 transform -rotate-45"></div>
            <div className="h-0.5 w-0.5 bg-red-500"></div>
          </div>

          {/* Right corner brackets */}
          <div className="absolute right-4 bottom-4 flex flex-col gap-1">
            <div className="w-4 h-0.5 bg-red-500 transform rotate-45"></div>
            <div className="h-0.5 w-0.5 bg-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Front side
  return (
    <div
      onClick={() => setIsFlipped(true)}
      className="w-full aspect-[2.5/3.5] bg-gradient-to-b from-blue-400 via-blue-300 to-white rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105 p-6 flex flex-col items-center justify-between relative overflow-hidden"
    >
      {/* Top corner accents - red flaps */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-red-500 to-red-400 opacity-70 rounded-br-3xl transform -rotate-12"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500 to-red-400 opacity-70 rounded-bl-3xl transform rotate-12"></div>

      {/* Top Great Balls - left and right */}
      <div className="absolute top-8 left-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-gray-400 rounded-full flex items-center justify-center border-4 border-gray-500 relative shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-300 rounded-full border-b-2 border-gray-600"></div>
          <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-700 z-10"></div>
        </div>
      </div>

      <div className="absolute top-8 right-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-gray-400 rounded-full flex items-center justify-center border-4 border-gray-500 relative shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-300 rounded-full border-b-2 border-gray-600"></div>
          <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-700 z-10"></div>
        </div>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-2 z-10">
        {/* EMPEROR text */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-yellow-400 drop-shadow-lg" style={{ textShadow: '3px 3px 0 #1F2937, -1px -1px 0 #2563EB' }}>
            EMPEROR
          </h2>
          <p className="text-sm font-bold text-cyan-300 drop-shadow-md">TCG League</p>
        </div>

        {/* Center large Great Ball indicator */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-gray-800 shadow-xl relative my-2">
          {/* Blue top half - progress indicator */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-400 rounded-full border-b-4 border-gray-800"></div>
          {/* White bottom half */}
          {/* Center button */}
          <div className="w-6 h-6 bg-gray-400 rounded-full border-3 border-gray-600 z-10"></div>
        </div>

        {/* Player name */}
        <p className="text-sm font-bold text-gray-800 text-center truncate max-w-xs">{player.name}</p>

        {/* BP and rank info */}
        <div className="text-xs text-gray-700 text-center">
          <p>BP: {player.bp}</p>
          <p>Great Ball Rank</p>
        </div>
      </div>

      {/* Bottom Great Balls */}
      <div className="absolute bottom-8 left-6">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-3 border-gray-800 shadow-lg">
          <div className="absolute w-12 h-6 bg-white bottom-0 rounded-b-full border-b-2 border-gray-700"></div>
          <div className="w-3 h-3 bg-white rounded-full z-10"></div>
        </div>
      </div>

      <div className="absolute bottom-8 right-6">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-3 border-gray-800 shadow-lg">
          <div className="absolute w-12 h-6 bg-white bottom-0 rounded-b-full border-b-2 border-gray-700"></div>
          <div className="w-3 h-3 bg-white rounded-full z-10"></div>
        </div>
      </div>

      {/* Corner decorative brackets */}
      <div className="absolute top-2 left-2 border-t-2 border-l-2 border-white w-3 h-3"></div>
      <div className="absolute top-2 right-2 border-t-2 border-r-2 border-white w-3 h-3"></div>
      <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-gray-700 w-3 h-3"></div>
      <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-gray-700 w-3 h-3"></div>
    </div>
  );
}
