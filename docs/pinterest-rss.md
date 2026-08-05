# Pinterest RSS feeds

Pinterest RSS files are generated from published project Markdown in
`content/projects`. They do not change any visible website page. A production
build regenerates the files before Next.js builds, and the generated XML is
served as a static public asset.

Run the generator locally:

```sh
npm run pinterest:generate
npm run pinterest:validate
```

## Pinterest board setup

Claim `https://www.spokanecabinetsplus.com` in the Cabinets Plus Pinterest
Business account before connecting the feeds. Create each board with the exact
name and description below, then connect its RSS URL in Pinterest's bulk-create
settings.

| RSS URL | Board name | Board description |
| --- | --- | --- |
| `https://www.spokanecabinetsplus.com/pinterest/kitchen-cabinet-ideas.xml` | Kitchen Cabinet Ideas | Kitchen cabinet ideas from real Cabinets Plus projects in Spokane, Washington. Explore white shaker cabinets, natural wood cabinetry, two-tone kitchens, islands, pantries, quartz countertops and modern storage. |
| `https://www.spokanecabinetsplus.com/pinterest/bathroom-vanity-ideas.xml` | Bathroom Vanity Ideas | Bathroom vanity ideas from completed Cabinets Plus projects. Discover floating vanities, double vanities, shaker cabinets, natural wood finishes and stone countertops for Spokane bathroom remodels. |
| `https://www.spokanecabinetsplus.com/pinterest/laundry-mudroom-cabinets.xml` | Laundry Room & Mudroom Cabinets | Laundry room and mudroom cabinet ideas featuring built-in storage, entry benches, cubbies and practical custom cabinetry from Cabinets Plus projects in Spokane, Washington. |
| `https://www.spokanecabinetsplus.com/pinterest/home-bar-cabinet-ideas.xml` | Home Bar & Beverage Center Ideas | Home bar cabinet ideas including wet bars, coffee bars, beverage centers, wine storage and entertaining spaces designed with custom cabinetry and stone countertops. |
| `https://www.spokanecabinetsplus.com/pinterest/custom-built-ins.xml` | Custom Built-Ins & Home Storage | Custom built-in cabinet and home storage ideas for offices, closets, fireplace walls, living rooms, entryways and other tailored spaces by Cabinets Plus in Spokane, Washington. |
| `https://www.spokanecabinetsplus.com/pinterest/glass-shower-enclosures.xml` | Glass Shower Enclosure Ideas | Glass shower enclosure ideas from completed Spokane-area projects, including frameless shower doors, modern bathroom glass and custom enclosures by Cabinets Plus. |
| `https://www.spokanecabinetsplus.com/pinterest/countertop-design-ideas.xml` | Quartz, Quartzite & Stone Countertop Ideas | Quartz, quartzite, granite and marble countertop ideas selected from real Cabinets Plus kitchens, bathrooms, islands and home bars in Spokane, Washington. |
| `https://www.spokanecabinetsplus.com/pinterest/spokane-remodeling.xml` | Spokane Kitchen & Bathroom Remodeling | Kitchen, bathroom and custom cabinetry remodeling inspiration from completed Cabinets Plus projects in Spokane and the Inland Northwest. |

The first six feeds are primary feeds: every published project image is assigned
to exactly one of them. The countertop feed selects no more than three strongly
countertop-focused images per project. The Spokane feed contains one cover image
per project.

## Stable GUIDs

Each item GUID is derived from the feed ID, project slug and normalized image
path. It stays stable across builds, hostname/CDN changes and metadata edits. A
replacement or renamed image intentionally receives a new GUID.

No Tina schema field is required for GUIDs. If manual Pinterest overrides become
necessary later, optional fields for exclusion, feed selection, title and
description can be added to each media object without changing the GUID strategy.

## Safe launch sequence

1. Connect a feed to a secret Pinterest board first.
2. Verify its image, title, description and project link.
3. Create and connect the six primary public boards.
4. Connect the two curated feeds after the primary archive finishes importing.

Pinterest fetches RSS feeds on its own schedule. Do not depend on RSS for an
exact publication time. Pinterest currently says that feed updates are imported
within 24 hours, the oldest feed content is published first, and RSS publishing
is limited to up to 200 Pins per day. The initial archive therefore will not
appear all at once. Stable GUIDs prevent unchanged items from being recreated
when the feed is regenerated.
