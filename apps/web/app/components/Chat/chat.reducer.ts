//chat.reducer.ts

export type ChatState = {
  messages: Message[];
  input: string;
  loading: boolean;
  consented: boolean;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export const initialChatState: ChatState = {
  messages: [],
  input: "",
  loading: false,
  consented: false,
};

export type ChatAction =
  | { type: "message_sent"; payload: string }
  | { type: "message_received"; payload: string }
  | { type: "message_failed" }
  | { type: "input_changed"; payload: string }
  | { type: "consented" };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "message_sent":
      return {
        ...state,
        input: "",
        loading: true,
        messages: [...state.messages, { role: "user", content: action.payload }, { role: "assistant", content: "" }],
      };
    case "message_received": {
      const messages = [...state.messages];
      messages[messages.length - 1] = { role: "assistant", content: action.payload };
      return { ...state, messages, loading: false };
    }
    case "message_failed": {
      const messages = [...state.messages];
      messages[messages.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
      return { ...state, messages, loading: false };
    }
    case "input_changed":
      return { ...state, input: action.payload };
    case "consented":
      return { ...state, consented: true };
  }
}
