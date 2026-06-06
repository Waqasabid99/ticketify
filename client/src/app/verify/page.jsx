"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";

const page = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    if (!token) {
        return <div>Invalid or expired verification link</div>;
    }

    const verifyEmail = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8000/api/v1/email/verify`,
                { token },
                { withCredentials: true }
            );
            console.log("response", response);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        verifyEmail();
    }, []);

    return <div>Verify Email</div>;
};

export default page;