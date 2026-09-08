import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AuthSheet } from "../components/auth/AuthSheet";

const AuthSheetContext = createContext<() => void>(() => {});

export function useAuthSheet() {
  return useContext(AuthSheetContext);
}

export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  return (
    <AuthSheetContext.Provider value={show}>
      {children}
      <AuthSheet visible={visible} onClose={hide} />
    </AuthSheetContext.Provider>
  );
}
