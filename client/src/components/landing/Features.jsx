import React from "react";
import {
  UserCircleIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CubeTransparentIcon,
  ClockIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  GiftIcon,
} from "@heroicons/react/24/solid";

const featuresData = [
  {
    heading: "Your Personal AI Twin",
    Icon: UserCircleIcon,
  },
  {
    heading: "Blockchain-Secured Memory Storage",
    Icon: LockClosedIcon,
  },
  {
    heading: "Ownership-First by Design",
    Icon: GlobeAltIcon,
  },
  {
    heading: "Voice to Memory",
    Icon: MicrophoneIcon,
  },
  {
    heading: "Emotion & Timeline-Based Recall",
    Icon: CubeTransparentIcon,
  },
  {
    heading: "Encrypted by Default, Unlocked by You",
    Icon: ShieldCheckIcon,
  },
  {
    heading: "Context-Aware Thought Retrieval",
    Icon: SparklesIcon,
  },
  {
    heading: "Legacy Time Capsules",
    Icon: ClockIcon,
  },
  {
    heading: "Digital Twin as an NFT",
    Icon: GiftIcon,
  },
];

const FeatureCard = ({ heading, Icon }) => (
  <div className="border border-tlight/20 p-4 m-2 rounded-2xl h-48 backdrop-blur-md bg-gradient-to-br from-transparent via-bglight/3 to-bglight/6 flex flex-col justify-center hover:scale-98 transition-all duration-300">
    {Icon && (
      <div className="text-white opacity-90 mb-2 flex items-center gap-4">
        <Icon className="w-8 h-8"  />
        <h1 className="text-lg font-semibold">{heading}</h1>
      </div>
    )}
  </div>
);

const VerticalScroller = ({ features, reverse = false }) => {
  return (
    <div className="overflow-hidden h-[600px] relative w-full">
      <div
        className={`flex flex-col gap-4 animate-verticalScroll ${
          reverse ? "animate-reverseScroll" : ""
        }`}
      >
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
        {features.map((feature, index) => (
          <FeatureCard key={`dup-${index}`} {...feature} />
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full h-30 bg-gradient-to-b from-[#111117] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-[#111117] to-transparent pointer-events-none z-10" />
    </div>
  );
};

const Features = () => {
  const columnCount = 3;
  const chunkSize = Math.ceil(featuresData.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, i) =>
    featuresData.slice(i * chunkSize, (i + 1) * chunkSize)
  );

  return (
    <div className="mx-8 my-16">
      <div className="flex gap-4 justify-center">
        {columns.map((col, idx) => (
          <VerticalScroller key={idx} features={col} reverse={idx % 2 === 1} />
        ))}
      </div>
    </div>
  );
};

export default Features;
