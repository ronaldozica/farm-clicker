const NUMBER_SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function formatLargeNumber(value: number): string {
    if (!Number.isFinite(value)) return "0";

    const sign = value < 0 ? "-" : "";
    const absoluteValue = Math.abs(Math.floor(value));

    if (absoluteValue < 1000) {
        return `${sign}${absoluteValue}`;
    }

    let suffixIndex = Math.min(
        Math.floor(Math.log10(absoluteValue) / 3),
        NUMBER_SUFFIXES.length - 1
    );
    let scaledValue = absoluteValue / Math.pow(1000, suffixIndex);
    const decimals = scaledValue < 10 ? 1 : 0;

    if (Number(scaledValue.toFixed(decimals)) >= 1000 && suffixIndex < NUMBER_SUFFIXES.length - 1) {
        suffixIndex += 1;
        scaledValue /= 1000;
    }

    const formattedValue = scaledValue
        .toFixed(scaledValue < 10 ? 1 : 0)
        .replace(/\.0$/, "");

    return `${sign}${formattedValue}${NUMBER_SUFFIXES[suffixIndex]}`;
}
