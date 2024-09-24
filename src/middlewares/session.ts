import {session as grammySession} from "grammy";

export type sessionState = "start"

export type SessionData = {
    state: sessionState;
};

export const session = grammySession({
    initial: (): SessionData => ({
        state: "start",
    }),
});