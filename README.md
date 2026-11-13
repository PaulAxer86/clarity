# Clarity

Household accounts with the practical look of a classic desktop program. Menus, a toolbar, a tree of sections, list views and a status bar: no clutter, everything one click away.

![Clarity icon](build/icon.png)

## What it does

- **Overview**: income, expenses, balance and savings rate for the month, spending by type, a budget bar per category (it warns when variable spending runs ahead of the calendar), and a six-month chart.
- **Fixed expenses**: rent, utilities, insurance and subscriptions with their due day. Post everything that is due to the register with one click (F9).
- **Daily spending** and **Groceries**, with a per-store summary and average basket.
- **Fuel log**: litres and odometer per fill-up give you price per litre, L/100 km and cost per 100 km.
- **Categories & budgets**, edited directly in the table.
- **Reports**: categories by month for the last six months, with over-budget months in red.
- **Household**: add the people who share the costs. Each entry records who paid; Clarity splits shared costs equally and tells you who owes whom. Payments from a joint account are left out of the split.
- **Export to CSV**, **back up** and **restore**.

Keyboard: `Ins` new entry · `Enter` edit · `Del` delete · `PgUp`/`PgDn` change month · `F9` post fixed expenses · `Alt+F/E/V/T/H` menus · `F1` about.

## Install

Download the installer for your system from the [latest release](https://github.com/PaulAxer86/clarity/releases/latest).

| System | File | Notes |
| --- | --- | --- |
| Windows | `Clarity-x.y.z-win-x64.exe` | The installer is not code-signed yet, so SmartScreen shows a warning: choose **More info › Run anyway**. |
| macOS | `Clarity-x.y.z-mac-*.dmg` | Not notarized yet. After dragging Clarity to Applications, right-click it and choose **Open** the first time. |
| Debian / Ubuntu | `Clarity-x.y.z-linux-amd64.deb` | `sudo apt install ./Clarity-x.y.z-linux-amd64.deb` |
| Any Linux | `Clarity-x.y.z-linux-x86_64.AppImage` | `chmod +x` the file, then run it. |

## Your data

The ledger is a single JSON file on your computer. Nothing is sent anywhere.

| System | Location |
| --- | --- |
| Windows | `%APPDATA%\Clarity\ledger.json` |
| macOS | `~/Library/Application Support/Clarity/ledger.json` |
| Linux | `~/.config/Clarity/ledger.json` |

A copy is saved once a day in the `backups` folder next to it (the last 30 days are kept). **Help › About Clarity** shows the exact path.

Clarity opens with sample data for a two-person household. **File › New empty ledger** clears it and keeps the categories as a starting point.

## Development

Requires Node.js 22.

```bash
npm install
npm start          # run the app
npm run smoke      # headless check: loads the app, saves a ledger, reports errors
npm run dist       # build installers for the current system into dist/
```

Project layout:

- `src/clarity.html`: the whole interface (HTML, CSS and JavaScript in one file).
- `main.js`: the Electron main process: window, ledger file, daily backups, file dialogs.
- `preload.js`: the small API the page uses to talk to the main process.
- `scripts/build-html.js`: wraps the interface into `app/index.html` with a strict Content Security Policy.
- `scripts/make-icon.js`: draws the pixel-art app icon into `build/icon.png`.

## Releasing

Update `version` in `package.json`, then tag and push:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions builds the Windows, macOS and Linux installers and attaches them to a new release.

## License

[MIT](LICENSE)
