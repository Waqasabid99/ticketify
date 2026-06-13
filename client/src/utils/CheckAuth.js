"use client";

import { useAuthStore } from "@/store/authStore"
import { useEffect } from "react";

const CheckAuth = ({ children }) => {
    const { verifyUser } = useAuthStore();

    useEffect(() => {
        verifyUser()
    }, [])

    return (
        <>{children}</>
    )
}

export default CheckAuth