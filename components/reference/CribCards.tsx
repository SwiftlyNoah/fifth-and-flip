/** The whole method on two index cards. Print-friendly: see @media print. */
export function CribCards() {
  return (
    <div className="print-sheet grid gap-4 sm:grid-cols-2">
      <article className="crib">
        <h3>Assistant</h3>
        <p className="who">You see five cards and the coin. You lay four down.</p>
        <ol>
          <li>
            Turn the five into numbers. <span className="m">&#9827; = rank, &#9830; +13, &#9829; +26, &#9824; +39</span>
            , black joker 53, red 54.
          </li>
          <li>
            Add all five. The remainder mod 5 is <b>i</b>. Hide the card <b>i</b> up from the bottom, counting the
            lowest as zero.
          </li>
          <li>
            <b>u</b> = hidden card&rsquo;s number minus <b>i</b>. Then <b>m</b> is the block of five that <b>u</b> lands
            in.
            <table>
              <tbody>
                <tr>
                  <th>u</th>
                  <td>1&ndash;5</td>
                  <td>6&ndash;10</td>
                  <td>11&ndash;15</td>
                  <td>16&ndash;20</td>
                  <td>21&ndash;25</td>
                </tr>
                <tr>
                  <th>m</th>
                  <td>0</td>
                  <td>1</td>
                  <td>2</td>
                  <td>3</td>
                  <td>4</td>
                </tr>
                <tr>
                  <th>u</th>
                  <td>26&ndash;30</td>
                  <td>31&ndash;35</td>
                  <td>36&ndash;40</td>
                  <td>41&ndash;45</td>
                  <td>46&ndash;50</td>
                </tr>
                <tr>
                  <th>m</th>
                  <td>5</td>
                  <td>6</td>
                  <td>7</td>
                  <td>8</td>
                  <td>9</td>
                </tr>
              </tbody>
            </table>
          </li>
          <li>
            Put the <b>lowest</b> of your four cards in the slot given by the coin and the band.
            <table>
              <tbody>
                <tr>
                  <th />
                  <th>m 0&ndash;5</th>
                  <th>m 6&ndash;9</th>
                </tr>
                <tr>
                  <th>heads</th>
                  <td>slot 1</td>
                  <td>slot 2</td>
                </tr>
                <tr>
                  <th>tails</th>
                  <td>slot 3</td>
                  <td>slot 4</td>
                </tr>
              </tbody>
            </table>
          </li>
          <li>
            The other three, left to right, spell <b>m mod 6</b>.
            <table>
              <tbody>
                <tr>
                  <th>0</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                </tr>
                <tr>
                  <td>LMH</td>
                  <td>LHM</td>
                  <td>MLH</td>
                  <td>MHL</td>
                  <td>HLM</td>
                  <td>HML</td>
                </tr>
              </tbody>
            </table>
          </li>
        </ol>
      </article>

      <article className="crib">
        <h3>Magician</h3>
        <p className="who">You see four cards in a row. You name the fifth and the coin.</p>
        <ol>
          <li>
            Find the <b>lowest</b> card in the row. Slots 1 and 2 are heads, slots 3 and 4 are tails. Slots 1 and 3 mean{' '}
            <b>m</b> is under six, slots 2 and 4 mean add six.
          </li>
          <li>
            The other three, left to right, give <b>m mod 6</b>:{' '}
            <span className="m">LMH 0 &middot; LHM 1 &middot; MLH 2 &middot; MHL 3 &middot; HLM 4 &middot; HML 5</span>.
            Add to get <b>m</b>.
          </li>
          <li>
            Add the four numbers. <b>start</b> = 5 minus the remainder mod 5, and a remainder of 0 means start is 5.
          </li>
          <li>
            <b>u</b> = 5<b>m</b> + <b>start</b>.
          </li>
          <li>
            Write the four shown numbers in order and subtract 0, 1, 2, 3 from them. Count how many of those four{' '}
            <b>u</b> reaches or passes, and add that to <b>u</b>. That number is the hidden card.
          </li>
        </ol>
      </article>
    </div>
  );
}
