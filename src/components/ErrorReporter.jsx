"use client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearError } from "../redux/slices/taskSlice";
import { useFeedback } from "./ui/Feedback";

/**
 * Surfaces failed writes.
 *
 * Rejected thunks have always stored their message in `state.tasks.error`, but
 * nothing ever rendered it — so a save the server refused looked exactly like a
 * save that worked. That mattered less when the server quietly accepted almost
 * anything; now that it rejects an unknown project or a task that no longer
 * exists, the refusal has to be visible or the button just appears dead.
 */
export default function ErrorReporter() {
  const dispatch = useDispatch();
  const { toast } = useFeedback();
  const error = useSelector((state) => state.tasks.error);
  const last = useRef(null);

  useEffect(() => {
    if (!error || error === last.current) return;
    last.current = error;
    toast(error, "error");
    /* Cleared straight away so the same failure can be reported again if the
       user retries and it fails again. */
    const id = setTimeout(() => {
      dispatch(clearError());
      last.current = null;
    }, 300);
    return () => clearTimeout(id);
  }, [error, toast, dispatch]);

  return null;
}
