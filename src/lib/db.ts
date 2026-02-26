import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query } from "firebase/firestore";

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    createdAt?: string;
}

export const saveUser = async (user: UserProfile) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            ...user,
            createdAt: new Date().toISOString(),
            worshipProgress: 0,
            fastingStreak: 0,
            fastingHistory: [],
            worshipHistory: {},
            currentCity: "Jakarta"
        });
    }
};

export const syncUserData = async (uid: string, data: any) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true });
};

export const getUserData = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    }
    return null;
};

export const updateFastingHistory = async (uid: string, date: string, isFasting: boolean) => {
    const userRef = doc(db, "users", uid);
    if (isFasting) {
        await updateDoc(userRef, {
            fastingHistory: arrayUnion(date)
        });
    } else {
        await updateDoc(userRef, {
            fastingHistory: arrayRemove(date)
        });
    }
};

// --- Daily Logs Subcollection ---

export const saveDailyLog = async (uid: string, date: string, data: any) => {
    // Reference: users/{uid}/dailyLogs/{date}
    const logRef = doc(db, "users", uid, "dailyLogs", date);
    await setDoc(logRef, data, { merge: true });
};

export const getDailyLog = async (uid: string, date: string) => {
    const logRef = doc(db, "users", uid, "dailyLogs", date);
    const logSnap = await getDoc(logRef);
    if (logSnap.exists()) {
        return logSnap.data();
    }
    return null;
};

export const getMonthlyLogs = async (uid: string, month: number, year: number) => {
    const logsRef = collection(db, "users", uid, "dailyLogs");
    const q = query(logsRef);
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    querySnapshot.forEach((doc) => {
        if (doc.id.startsWith(prefix)) {
            logs.push({ id: doc.id, ...doc.data() });
        }
    });
    return logs;
};

export const getAllDailyLogs = async (uid: string) => {
    const logsRef = collection(db, "users", uid, "dailyLogs");
    const q = query(logsRef);
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];

    querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
};
