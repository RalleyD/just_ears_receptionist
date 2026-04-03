/*
Acts as a neutral module, providing the mode state
for the agent. Which, is shared by routes and realtime-client.

Follows the single-source-of-truth principle.
Keeping responsbilities between modules clean and separate.

POST -> routes -> client (each call in its own handleConnection websocket node)

Observer pattern: runs websocket callbacks to update sessions.
    Acting as a message bus between the incoming POST and the websockets.
    That way, neither layer needs to know about the other.
E.g)
    Call 1 -> register CB 1 -> sessions: { call1: cb1 }
    Call 2 -> register CB 2 -> sessions: { call1: cb1, call2: cb2 }
    Mode change -> call (cb1, cb2) -> both sessions updated.
    End Call 1 -> unregister CB 1 -> sessions { call2: cb2 }
*/

// define AgentMode type
export type AgentMode = 'normal' | 'out-of-office';

// ------------------------------

// module-level var for agent state
let agentMode: AgentMode = 'normal';

// a Map typed with its key and value types
// describes a function that takes a mode and returns nothing
const sessions = new Map<symbol, (mode: AgentMode) => void>();

// ------------------------------
// public functions

// getAgentMode -> used to configure new call sessions
// a simple getter (arrow function)
export const getAgentMode = (): AgentMode => agentMode;

// setAgentMode - observer pattern: update state + calls all registered websocket callbacks when mode changes
export function setAgentMode(mode: AgentMode): void {
    // set the new mode
    agentMode = mode;
    // update the session.state for all sessions
    sessions.forEach(callback => callback(mode));
}

export function registerSession(callback: (mode: AgentMode) => void): () => void {
    /*
    Stores callbacks such that they can be
    individually accessed (mode change) &
    removed (call ends).
    Leverages map with a unique session key
    Map<symbol, callback>
    Needs to return a cleanup function ->
    each session can remove itself from the list
    when the call ends.
    */
   const key = Symbol();
   sessions.set(key, callback)

   return () => {
    // remove session
    sessions.delete(key);
   }
}

// ------------------------------