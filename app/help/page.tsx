import Link from "next/link";

export default function HelpPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-accent-primary hover:text-accent-secondary transition-colors"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">How to Play</h1>
      </div>

      <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Objective
          </h2>
          <p>
            Reveal all cells that do not contain mines. If you reveal a mine,
            you lose. Clear the board as fast as you can.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Controls
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Left click</strong> (or tap) a hidden cell to reveal it.
            </li>
            <li>
              <strong>Right click</strong> (or long press on mobile) to place or
              remove a flag.
            </li>
            <li>
              <strong>Click a revealed number</strong> to chord-reveal its
              neighbors (if you have placed the correct number of flags around
              it).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Numbers
          </h2>
          <p>
            When a cell is revealed, it shows a number indicating how many of
            its 8 neighbors are mines. If the number is 0, all its neighbors are
            automatically revealed too (flood fill).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Flags
          </h2>
          <p>
            Use flags to mark cells you think contain mines. The mine counter in
            the header shows <em>total mines minus flags placed</em>. Flags do
            not prevent losing &mdash; only avoid clicking mines does.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            First Click Safety
          </h2>
          <p>
            Your first click is always safe. Mines are placed after you make
            your first reveal, ensuring you never lose on the first move.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Difficulty Levels
          </h2>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Beginner:</strong> 9&times;9 grid, 10 mines
            </li>
            <li>
              <strong>Intermediate:</strong> 16&times;16 grid, 40 mines
            </li>
            <li>
              <strong>Expert:</strong> 30&times;16 grid, 99 mines
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Best Times
          </h2>
          <p>
            Your fastest winning time for each difficulty is saved locally. Try
            to beat your personal records!
          </p>
        </section>
      </div>
    </main>
  );
}
