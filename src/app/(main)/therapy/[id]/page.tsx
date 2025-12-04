'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import TextTherapyClient from "@/components/therapy/TextTherapyClient";
import LiveTherapyPage from "@/app/therapy-session/[id]/page";

export const maxDuration = 120;

export default function TextTherapyPage() {
    const [isClient, setIsClient] = useState(false);
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // Or a loading spinner
    }

    // Check if the URL indicates an immediate voice session
    if (id && id.startsWith('immediate-voice-')) {
        return <LiveTherapyPage />;
    }

    // Default to text therapy
    return <TextTherapyClient />;
}
