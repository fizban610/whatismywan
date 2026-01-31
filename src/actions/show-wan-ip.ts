import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { exec } from "child_process";
import { platform } from "os";

// Stream Deck key size (using @2x for better quality)
const KEY_SIZE = 144;

/**
 * Action that displays your current public IP address on the Stream Deck key.
 * When pressed, it copies the IP address to your clipboard.
 */
@action({ UUID: "net.jdhl.whatismywan.show-ip" })
export class ShowWanIP extends SingletonAction<WanIPSettings> {
	// Store the interval timer so we can clear it when the action disappears
	private refreshInterval: ReturnType<typeof setInterval> | null = null;

	// Cache the current IP address so we can copy it on key press
	private currentIP: string = "Loading...";

	// Cache the current action for updating display
	private currentAction: WillAppearEvent<WanIPSettings>["action"] | null = null;

	// Current display lines setting
	private displayLines: 1 | 2 | 4 = 1;

	/**
	 * Called when the action appears on the Stream Deck.
	 * This is where we fetch the IP and start a refresh timer.
	 */
	override async onWillAppear(ev: WillAppearEvent<WanIPSettings>): Promise<void> {
		// Store reference to action for later updates
		this.currentAction = ev.action;

		// Get the display lines setting (default to 1)
		this.displayLines = ev.payload.settings.displayLines ?? 1;

		// Fetch the IP immediately when the action appears
		await this.fetchAndDisplayIP(ev.action);

		// Set up a timer to refresh the IP every 5 minutes (300000 ms)
		this.refreshInterval = setInterval(async () => {
			await this.fetchAndDisplayIP(ev.action);
		}, 300000);
	}

	/**
	 * Called when the user changes settings in the property inspector.
	 */
	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<WanIPSettings>): Promise<void> {
		this.displayLines = ev.payload.settings.displayLines ?? 1;

		// Refresh the display with new settings
		if (this.currentAction) {
			await this.currentAction.setImage(this.createTextImage(this.currentIP));
		}
	}

	/**
	 * Called when the action disappears from the Stream Deck.
	 * We clean up our refresh timer here to prevent memory leaks.
	 */
	override onWillDisappear(ev: WillDisappearEvent<WanIPSettings>): void {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
		this.currentAction = null;
	}

	/**
	 * Called when the user presses the key.
	 * We copy the current IP address to the clipboard and show a brief confirmation.
	 */
	override async onKeyDown(ev: KeyDownEvent<WanIPSettings>): Promise<void> {
		try {
			// Copy to clipboard using platform-specific commands
			await this.copyToClipboard(this.currentIP);

			// Show "Copied!" briefly to confirm the action worked
			await ev.action.setImage(this.createStatusImage("Copied!"));

			// After 1.5 seconds, restore the IP display
			setTimeout(async () => {
				await ev.action.setImage(this.createTextImage(this.currentIP));
			}, 1500);

			// Show an "OK" indicator on the key (green checkmark in Stream Deck)
			await ev.action.showOk();
		} catch (error) {
			// If something goes wrong, show an alert indicator
			await ev.action.showAlert();
			streamDeck.logger.error("Failed to copy IP to clipboard", error);
		}
	}

	/**
	 * Creates an SVG image for status messages (Copied!, Error, etc.)
	 * Always displayed as a single centered line.
	 */
	private createStatusImage(text: string): string {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}"><rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="black"/><text x="${KEY_SIZE / 2}" y="${KEY_SIZE / 2}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${text}</text></svg>`;

		const base64 = Buffer.from(svg).toString("base64");
		return `data:image/svg+xml;base64,${base64}`;
	}

	/**
	 * Creates an SVG image with the IP address formatted according to displayLines setting.
	 * Returns a data URL that can be passed to setImage().
	 */
	private createTextImage(ip: string): string {
		// Split IP into octets (e.g., ["192", "168", "1", "100"])
		const octets = ip.split(".");

		// If not a valid IP format, show as single line
		if (octets.length !== 4) {
			return this.createSingleLineImage(ip);
		}

		switch (this.displayLines) {
			case 4:
				return this.createFourLineImage(octets);
			case 2:
				return this.createTwoLineImage(octets);
			case 1:
			default:
				return this.createSingleLineImage(ip);
		}
	}

	/**
	 * Creates image with IP on a single line.
	 * Font size adjusts based on IP length.
	 */
	private createSingleLineImage(text: string): string {
		// Calculate font size based on text length
		// Max IPv4 length is 15 chars (xxx.xxx.xxx.xxx)
		let fontSize: number;
		const len = text.length;

		if (len <= 7) {
			fontSize = 26;
		} else if (len <= 11) {
			fontSize = 22;
		} else if (len <= 13) {
			fontSize = 19;
		} else {
			fontSize = 17;
		}

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}"><rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="black"/><text x="${KEY_SIZE / 2}" y="${KEY_SIZE / 2}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${text}</text></svg>`;

		const base64 = Buffer.from(svg).toString("base64");
		return `data:image/svg+xml;base64,${base64}`;
	}

	/**
	 * Creates image with IP on two lines: xxx.xxx / xxx.xxx
	 */
	private createTwoLineImage(octets: string[]): string {
		const line1 = `${octets[0]}.${octets[1]}`;
		const line2 = `${octets[2]}.${octets[3]}`;

		// Two lines can use larger font
		const fontSize = 28;
		const lineHeight = fontSize * 1.3;
		const totalHeight = lineHeight * 2;
		const startY = (KEY_SIZE - totalHeight) / 2 + fontSize * 0.35;

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}"><rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="black"/><text x="${KEY_SIZE / 2}" y="${startY + lineHeight * 0.5}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${line1}</text><text x="${KEY_SIZE / 2}" y="${startY + lineHeight * 1.5}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${line2}</text></svg>`;

		const base64 = Buffer.from(svg).toString("base64");
		return `data:image/svg+xml;base64,${base64}`;
	}

	/**
	 * Creates image with IP on four lines: xxx / xxx / xxx / xxx
	 */
	private createFourLineImage(octets: string[]): string {
		// Four lines can use largest font
		const fontSize = 30;
		const lineHeight = fontSize * 1.1;
		const totalHeight = lineHeight * 4;
		const startY = (KEY_SIZE - totalHeight) / 2 + fontSize * 0.35;

		let textElements = "";
		for (let i = 0; i < 4; i++) {
			const y = startY + lineHeight * (i + 0.5);
			textElements += `<text x="${KEY_SIZE / 2}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${octets[i]}</text>`;
		}

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}"><rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="black"/>${textElements}</svg>`;

		const base64 = Buffer.from(svg).toString("base64");
		return `data:image/svg+xml;base64,${base64}`;
	}

	/**
	 * Copies text to the system clipboard using platform-specific commands.
	 * - macOS: uses pbcopy
	 * - Windows: uses PowerShell's Set-Clipboard
	 */
	private copyToClipboard(text: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const os = platform();
			let command: string;

			if (os === "darwin") {
				// macOS: pipe text to pbcopy using printf (more reliable than echo -n)
				command = `printf '%s' "${text}" | pbcopy`;
			} else if (os === "win32") {
				// Windows: use PowerShell's Set-Clipboard
				command = `powershell -command "Set-Clipboard -Value '${text}'"`;
			} else {
				// Linux: use xclip (less common for Stream Deck but just in case)
				command = `printf '%s' "${text}" | xclip -selection clipboard`;
			}

			exec(command, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Helper method that fetches the public IP from an API and updates the display.
	 * We use ipify.org which is a free, reliable IP lookup service.
	 */
	private async fetchAndDisplayIP(actionInstance: WillAppearEvent<WanIPSettings>["action"]): Promise<void> {
		try {
			// Fetch the public IP from ipify.org
			const response = await fetch("https://api.ipify.org");

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			// Get the IP address from the response
			this.currentIP = await response.text();

			// Update the key display with the IP address as an image
			await actionInstance.setImage(this.createTextImage(this.currentIP));

			streamDeck.logger.info(`Fetched WAN IP: ${this.currentIP}`);
		} catch (error) {
			// If we can't fetch the IP, show an error message
			this.currentIP = "Error";
			await actionInstance.setImage(this.createStatusImage("No Conn"));
			streamDeck.logger.error("Failed to fetch WAN IP", error);
		}
	}
}

/**
 * Settings for the WAN IP action.
 */
type WanIPSettings = {
	// Number of lines to display the IP on (1, 2, or 4)
	displayLines?: 1 | 2 | 4;
};
