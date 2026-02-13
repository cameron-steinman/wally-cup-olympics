"use client";
export default function GlobalError({ error }: { error: Error }) {
  return (
    <html><body><h1>Something went wrong</h1><p>{error.message}</p></body></html>
  );
}
