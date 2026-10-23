# Restaurant booking site

Clone this repository when you want another restaurant. Each copy stores its bookings against its own restaurant id, so the diaries stay separate.

```bash
git clone https://github.com/RichardHubbert/tp-fishydelishy.git my-restaurant
cd my-restaurant
npm install
npm run new-restaurant -- "Restaurant Name"
npm run dev
```

`npm run new-restaurant` creates a new restaurant row, eight starter tables, and writes `.env`. That file is not committed. The next clone gets a different id.

Bookings, tables, and the admin diary for this copy only use that id. Upload the built `dist` folder to the public path printed by the command, for example `/restaurant-name` on tablepilot.co.uk.
