# New restaurant

1. Clone this repository into a new folder.
2. Run `npm install`.
3. Run `npm run new-restaurant -- "Restaurant Name"`.
4. Run `npm run dev`.

The command creates a restaurant id that no other copy uses, plus eight empty tables. Bookings from this copy are saved with that id. `.env` holds the id, the name, and the public path, and it is left out of Git.

Build with `npm run build` and upload `dist` to the path the command printed.
