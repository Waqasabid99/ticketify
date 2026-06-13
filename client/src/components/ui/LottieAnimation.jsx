"use client";
import Lottie from "lottie-react";

export default function LottieAnimation({ animationData }) {
    return (
        <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            initialSegment={[0, 119]}
        />
    );
};