# BetterVencord

BetterVencord is a patchset for Vencord that adds BetterDiscord compatibility.
It allows BetterDiscord plugins to run in Vencord.

## Installation

You need pnpm, git and Node.js installed.

You can also use Deno v2 instead of Node.js, I like it more personally.

### For Discord Desktop

1. Clone the repository:
   ```bash
   git clone --recurse-submodules https://github.com/Davilarek/BetterVencordPatchset
   cd BetterVencordPatchset
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build BetterVencord:
   ```bash
   # Using tsx (if you only have pnpm):
   pnpx tsx scripts/build.ts

   # Using Deno (if you have Deno installed):
   deno task build:deno
   ```

4. Inject into Discord:
   ```bash
   cd dist/Vencord
   pnpm inject
   ```

### For Web Browser

1. After building with either method above, look in `dist/Vencord/dist/` for:
   - `Vencord.user.js` (UserScript)
   - `extension-chrome.zip` (Chrome extension)
   - `extension-firefox.zip` (Firefox extension)

2. For UserScript: Add `Vencord.user.js` to your favorite manager

3. For extensions: Load unpacked extension

## License

Undecided.
