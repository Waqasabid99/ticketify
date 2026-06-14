"use client";

import { useAuthStore } from "@/store/authStore"
import { useEffect } from "react";

const CheckAuth = ({ children }) => {
    const { verifyUser, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            verifyUser()
        }
    }, [isAuthenticated])

    return (
        <>{children}</>
    )
}

export default CheckAuth