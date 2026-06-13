"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const DashboardBox = ({
    text,
    subHeading,
    className,
    button,
}) => {
    const navigate = useRouter();
    return (
        <div
            className={`rounded bg-(--color-bg-surface) border border-(--color-border-default) p-6 mb-3 text-(--color-text-primary) shadow-md ${className}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{text}</h1>
                    <p className="text-white text-[14px] py-1">{subHeading || ""}</p>
                </div>
                {button ? <div className="flex items-center gap-3">{button}</div> : ""}
            </div>
        </div>
    );
};

export default DashboardBox;