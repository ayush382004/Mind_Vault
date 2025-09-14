import React, { useState } from "react";
import { Link } from "react-router";

const Footer = () => {
  const socialLinks = [
    {
      name: "Twitter",
      url: "https://www.twitter.com",
      icon: "ri-twitter-x-line",
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com",
      icon: "ri-instagram-line",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com",
      icon: "ri-linkedin-box-fill",
    },
  ];

  const quickLinks = [
    { name: "Feedback", url: "ff" },
    { name: "Report an Issue", url: "ff" },
    { name: "Mail Us", url: "ff" },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between px-6 sm:px-16 py-6 sm:py-12 gap-8 border border-bglight/20 mx-8 rounded-3xl z-10 backdrop-blur-md mb-8">
      <div className="flex flex-col sm:max-w-md text-center sm:text-start">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          MindVault
        </h1>
        <h2 className="text-gray-200 mb-4 text-sm sm:text-base">
          Learn | Solve | Conquer
        </h2>
        <div className="mb-4 flex gap-3 sm:gap-4 justify-center sm:justify-start">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 hover:-translate-y-1 hover:border-blue-400 border-transparent transition-all duration-300 text-xl bg-white/8 py-2 px-3 rounded-full border"
            >
              <i className={link.icon}></i>
            </a>
          ))}
        </div>
        <h2 className="text-neutral-400 text-sm sm:text-md">
          © 2025 MindVault. All rights reserved.
        </h2>
      </div>

      <div className="text-center sm:text-end flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 sm:mb-4">
          Quick Links
        </h1>
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            to={link.url}
            className="text-tlight hover:text-blue-400 hover:scale-95 transition-all duration-300 text-lg"
          >
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Footer;
