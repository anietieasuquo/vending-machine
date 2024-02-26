You might be wondering why there are so many objects --well, if we're dealing with a high-stakes environment where security is crucial, we can't risk accidentally exposing sensitive data from one layer or module to the other. This is why we have to be explicit about what we're doing, with no room for ambiguities or assumptions.
> Note: You might wonder why the files in `src/types` have `.ts` file extensions instead of `.d.ts`, --these files were renamed to `.ts` to avoid the need to manually copy them into the final build. This is because TypeScript automatically includes `.ts` files in the build, but not `.d.ts` files.

Talk about idempotency
