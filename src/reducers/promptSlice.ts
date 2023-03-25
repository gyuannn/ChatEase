import {
  AnyAction,
  createSlice,
  PayloadAction,
  ThunkAction,
} from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Prompt } from "../database/models/Prompt";

interface PromptState {
  prompts: Prompt[];
  selectedPromptId: number;
  refreshPanel: boolean;
  answerContent: string;
  isPromptResponsing: boolean;
}

const initialState: PromptState = {
  prompts: [],
  selectedPromptId: -1,
  refreshPanel: false,
  answerContent: "",
  isPromptResponsing: false,
};

const PromptSlice = createSlice({
  name: "prompt",
  initialState,
  reducers: {
    setPrompts: (state, action: PayloadAction<Prompt[]>) => {
      state.prompts = action.payload;
    },

    refreshPanel: (state) => {
      state.refreshPanel = !state.refreshPanel;
    },

    // set prompt id
    setSelectedPromptId: (state, action: PayloadAction<number>) => {
      if (action.payload === state.selectedPromptId) {
        return;
      }
      state.isPromptResponsing = false;
      state.answerContent = "";
      state.selectedPromptId = action.payload;
    },
    // setAnswerContent
    setAnswerContent: (state, action: PayloadAction<string>) => {
      if (window.electronAPI.storeIpcRenderer.get("stream_enable")) {
        state.answerContent = state.answerContent + action.payload;
      } else {
        state.answerContent = action.payload;
      }
    },
    // Clear answer content
    clearAnswerContent: (state) => {
      state.answerContent = "";
    },
    // Set isResponsing
    setPromptIsResponsing: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.answerContent = "";
      }
      state.isPromptResponsing = action.payload;
    },
  },
});

export const {
  setPrompts,
  setSelectedPromptId,
  setAnswerContent,
  clearAnswerContent,
  setPromptIsResponsing,
  refreshPanel,
} = PromptSlice.actions;

export const createPrompt = (
  promptId: number
): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch) => {
    setSelectedPromptId(promptId);
    window.electronAPI.databaseIpcRenderer
      .getAllPrompts()
      .then((prompts) => dispatch(setPrompts(prompts)));
  };
};

export const getAllPrompts = (): ThunkAction<
  void,
  RootState,
  unknown,
  AnyAction
> => {
  return async (dispatch) => {
    window.electronAPI.databaseIpcRenderer.getAllPrompts().then((prompts) => {
      dispatch(setPrompts(prompts));
      dispatch(refreshPanel());
    });
  };
};

export default PromptSlice.reducer;
