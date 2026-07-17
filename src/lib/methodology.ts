/**
 * Trading Methodology Documentation
 * =================================
 * Educational reference for the concepts used in this analysis.
 * Synthesized from canonical price-action, market-structure,
 * candlestick, and chart-pattern literature.
 */

export interface MethodologyConcept {
  id: string;
  term: string;
  category: "structure" | "smc" | "supply-demand" | "liquidity" | "candlestick" | "pattern";
  short: string;
  long: string;
  application: string;
}

export const METHODOLOGY: MethodologyConcept[] = [
  {
    id: "hh-hl-lh-ll",
    term: "Market Structure: HH / HL / LH / LL",
    category: "structure",
    short:
      "Higher-High, Higher-Low = bullish sequence. Lower-High, Lower-Low = bearish sequence. The sequence of swing highs and swing lows defines the trend.",
    long:
      "Market structure is the foundation of price-action trading. A series of HH and HL confirms an uptrend; a series of LH and LL confirms a downtrend. The first violation of the prior swing (e.g., a LH after a HH) is the earliest sign of a potential trend change. Structure is read on multiple timeframes — the higher timeframe (HTF) sets the directional bias, the lower timeframe (LTF) times the entry. Structure is objective: it is a fact of where price has been, not an opinion about where it will go.",
    application:
      "XAU/USD weekly structure is HH $5,602 → LH $5,400 → LL $3,942 — confirmed macro bearish. Daily structure echoes this with LH $4,120 → LL $3,983 → LH $4,033 → LL $3,976. Both timeframes align bearish → SHORT bias is structurally mandated.",
  },
  {
    id: "bos",
    term: "BOS — Break of Structure",
    category: "smc",
    short:
      "A BOS occurs when price breaks the most recent swing high (bullish BOS) or swing low (bearish BOS) in the direction of the prevailing trend. It confirms trend continuation.",
    long:
      "A Break of Structure is the Smart Money Concepts term for a continuation break. After a pullback to a discount (in an uptrend) or a premium (in a downtrend), price breaks the prior swing high/low — confirming that the institutional order flow is still pushing in the trend direction. A BOS is NOT a reversal signal; it is a continuation signal. The BOS is most powerful when it occurs after a liquidity sweep (the market takes out retail stops, then continues in the trend direction).",
    application:
      "XAU/USD has a confirmed daily bearish BOS below $3,983 (Jul 11) — this broke the prior LL and confirmed continuation toward $3,942. The PENDING BOS below $3,942 is the trigger that activates our final TP at $3,845.",
  },
  {
    id: "choch",
    term: "CHoCH — Change of Character",
    category: "smc",
    short:
      "A CHoCH is the first break against the prevailing trend structure — the earliest sign of a potential reversal. It precedes a BOS in the new direction.",
    long:
      "Change of Character is the most important early reversal signal in SMC methodology. After a sequence of, say, HH and HL (uptrend), the first lower-low (LL) — even if minor — is a CHoCH: it shows that buyers have lost control of the structure for the first time. A CHoCH does not guarantee a reversal, but it is the first warning. Traders then wait for a BOS in the new direction to confirm. On higher timeframes, a CHoCH carries more weight than on lower timeframes.",
    application:
      "XAU/USD printed the macro CHoCH on the weekly in March 2026 (first LH at $5,400 after the ATH). The daily CHoCH came at $4,120 (Jul 8). The most recent 1H CHoCH at $4,033 (Jul 17) is the execution-timing signal that triggers our SHORT entry zone.",
  },
  {
    id: "supply-demand",
    term: "Supply & Demand Zones",
    category: "supply-demand",
    short:
      "Supply zones are price areas where selling pressure originated (bearish order blocks). Demand zones are where buying pressure originated (bullish order blocks). Price tends to react at these zones on retest.",
    long:
      "Supply and demand zones are the footprints of institutional order flow. A supply zone is the origin of a strong bearish move — it represents unfilled sell orders that price will likely revisit. A demand zone is the origin of a strong bullish move — unfilled buy orders. The strongest zones are 'fresh' (untested since creation). Zones that have been tested once retain strength; zones tested twice or more are 'mitigated' and less reliable. Traders enter on the retest of a fresh zone with a stop just beyond the zone edge.",
    application:
      "Our entry at $4,055 sits inside the fresh-tested-once supply zone at $4,055–$4,060 (the 5-week range high — origin of the largest recent distribution). Stop loss at $4,085 sits $25 above the zone top, providing structural buffer.",
  },
  {
    id: "liquidity",
    term: "Liquidity & Stop Hunting",
    category: "liquidity",
    short:
      "Liquidity pools are clusters of resting stop orders (buy-stops above resistance, sell-stops below support). Smart money drives price into these pools to fill large orders, then reverses.",
    long:
      "Liquidity is the engine of price movement. Where retail traders place stop-losses is where price tends to go. Buy-stops accumulate above obvious resistance (prior swing highs, round numbers, equal highs). Sell-stops accumulate below obvious support (prior swing lows, round numbers, equal lows). Smart money (banks, hedge funds) needs liquidity to fill large positions — so they drive price INTO these stop clusters, trigger the stops (which become market orders), absorb the resulting flow, and then reverse. This is called a 'liquidity sweep' or 'stop hunt'. The sweep is followed by a move in the opposite direction.",
    application:
      "XAU/USD already swept sell-stops at $3,942 (8-month low) on Jul 15 — partial liquidity taken. The remaining sell-stops BELOW $3,942 are the next target. Our SHORT entry at $4,055 is positioned to capture the move from current price ($4,009) down through $3,942 (final sell-stop sweep) to our TP at $3,845.",
  },
  {
    id: "double-top",
    term: "Double Top (Bearish Reversal Pattern)",
    category: "pattern",
    short:
      "Two consecutive peaks at approximately the same price, separated by a trough. Break of the neckline (the trough) confirms the reversal. Measured move = pattern height projected below the neckline.",
    long:
      "The double top is one of the most reliable bearish reversal patterns. Price makes a high, retraces, returns to test the same high, and fails — forming the classic 'M' shape. The trough between the two peaks is the 'neckline'. A decisive close below the neckline confirms the pattern. The measured-move target = neckline price − (peak price − neckline price). The pattern invalidates on a close above the peaks. Double tops are most powerful when they form at the end of an extended uptrend and at a major resistance confluence.",
    application:
      "XAU/USD formed a double top at $4,200–$4,203 with neckline at $4,155. Pattern height = $45. Measured move = $4,155 − $45 = $4,110 — ALREADY ACHIEVED. This pattern confirmed the bearish reversal off the March LH at $5,400 and is feeding the larger macro bearish leg we are now trading.",
  },
  {
    id: "range-breakdown",
    term: "Range Breakdown (Continuation Pattern)",
    category: "pattern",
    short:
      "A consolidation range forms when price trades sideways between support and resistance. A break below support projects the range height downward as a measured-move target.",
    long:
      "Ranges are accumulation (bullish) or distribution (bearish) zones. A distribution range at the top of a downtrend — where price consolidates before continuing lower — is a high-probability short setup. The longer the consolidation, the more powerful the eventual break. The measured-move target from a range breakdown = range low − range height. Range breakdowns are most reliable when they occur in the direction of the prevailing higher-timeframe trend.",
    application:
      "XAU/USD has consolidated for 5 weeks in the $3,951.68 – $4,059.90 range. Range height = $108.22. The daily close below $4,000 on Jul 16 is the early breakdown signal. Once price closes below the range low at $3,951.68, the measured-move target = $3,951.68 − $108.22 = $3,843.46 → rounded to $3,845. THIS IS OUR FINAL TAKE PROFIT.",
  },
  {
    id: "topdown",
    term: "Top-Down Analysis (HTF → MTF → LTF)",
    category: "structure",
    short:
      "Always start with the highest timeframe to set the directional bias, then drill down to lower timeframes for entry refinement and execution timing. The HTF rules.",
    long:
      "Top-down analysis is the professional trader's workflow. Start at the weekly chart to determine the macro trend and key levels. Move to the daily chart to identify the current swing and intermediate structure. Drop to the 4-hour and 1-hour charts to pinpoint the strike entry, stop placement, and execution timing. The higher timeframe ALWAYS takes precedence — if the weekly is bearish and the 1-hour is bullish, you trade the bearish setup (or stand aside). Never trade against the HTF bias.",
    application:
      "XAU/USD: Weekly = bearish (HH→LH→LL sequence). Daily = bearish (price below all SMAs, recent $4,000 break). 4H = bearish (LH $4,033). 1H = bearish (CHoCH at $4,015). All four timeframes align bearish → HIGH-CONVICTION SHORT. Entry is taken at the LTF strike ($4,055) which sits inside the MTF supply zone and aligns with the HTF bias.",
  },
  {
    id: "rr",
    term: "Risk-to-Reward Ratio (R:R)",
    category: "structure",
    short:
      "The ratio of potential reward to potential risk. A 1:3 R:R means you risk 1 unit to make 3. Professional minimum is 1:3; elite setups target 1:5 or better.",
    long:
      "Risk-to-reward is the mathematics of trading profitability. With a 1:3 R:R, you can be wrong 75% of the time and still break even. With a 1:5 R:R, you can be wrong 83% of the time and still break even. R:R is determined by where you place your entry, stop, and target — each of which must be structurally derived, not arbitrary. A 'good' R:R does not justify a bad setup; it amplifies the edge of a good setup. Always require both structural confluence AND a minimum 1:3 R:R before entering.",
    application:
      "Our XAU/USD SHORT: Risk = $30 ($4,085 − $4,055). Reward = $210 ($4,055 − $3,845). R:R = 7.00:1. This is an elite setup — even at a 30% win rate, expectancy is strongly positive: (0.30 × $210) − (0.70 × $30) = $63 − $21 = +$42 per trade.",
  },
  {
    id: "candle-confirmation",
    term: "Candlestick Confirmation",
    category: "candlestick",
    short:
      "Japanese candlestick patterns provide entry confirmation at structurally significant levels. Patterns at supply/demand zones carry more weight than patterns in no-man's land.",
    long:
      "Candlestick analysis is the study of price-action at the micro level. Each candle reveals the balance of power between buyers and sellers in that period. Patterns like the engulfing, pin bar (hammer / shooting star), marubozu, and doji are most meaningful when they occur AT a structurally significant level — a supply zone, a demand zone, a trendline, or a moving average. A bullish engulfing in the middle of a range is noise; the same pattern at a demand zone after a sweep is a high-probability long signal. Always pair candlesticks with structure, never trade them in isolation.",
    application:
      "XAU/USD confirmed the SHORT setup with: (1) daily bearish engulfing closing below $4,000, (2) 4H shooting-star rejection at $4,033 (20-SMA), (3) 1H bearish marubozu on Jul 17, and (4) 1H dojis at $4,030–$4,035 showing buyer exhaustion at the 20-SMA supply zone.",
  },
];
