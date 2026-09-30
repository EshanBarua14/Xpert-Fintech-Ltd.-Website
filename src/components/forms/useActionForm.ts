"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like useActionState, but submits via onSubmit so React does not clear the
 * form after the action (React 19 resets forms that use the action attribute),
 * so typed values survive a validation error. "Add" forms that should empty
 * after saving remount with `key={state.savedAt}` instead.
 */
export function useActionForm<S>(
  action: (state: Awaited<S>, formData: FormData) => Promise<S>,
  initial: Awaited<S>,
) {
  const [state, dispatch, pending] = useActionState(action, initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }
  return { state, pending, onSubmit };
}
