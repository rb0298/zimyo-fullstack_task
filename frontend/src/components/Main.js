import { memo } from "react";
import { Posts } from "./Posts";
import { FormAddPost } from "./FormAddPost";

export const Main = memo(function Main() {
  return (
    <main>
      <FormAddPost />
      <Posts />
    </main>
  );
});
