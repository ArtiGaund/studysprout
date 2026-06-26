import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export interface FeedbackEntry {
    type: 'Bug Report' | 'Feature Request' | 'Complement';
    message: string;
};

export interface SendFeedbackPayload {
    userEmail: string;
    feedbacks: FeedbackEntry[];
}

export async function sendFeedbackService(payload: SendFeedbackPayload): Promise<void>{
    const { userEmail, feedbacks } = payload;
    const relativePath = `/api/send-feedback`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.post(url, { userEmail, feedbacks });
    if(!data.success) throw new Error(data.message);
    return data.data;
}