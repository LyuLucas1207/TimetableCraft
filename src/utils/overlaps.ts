export interface TimedEvent {
  id: string;
  startMin: number;
  endMin: number;
}

export interface LaidOutEvent<T extends TimedEvent> {
  event: T;
  column: number;
  columns: number;
}

export function layoutOverlaps<T extends TimedEvent>(events: T[]): LaidOutEvent<T>[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const columnEnds: number[] = [];
  const placed = sorted.map((event) => {
    let column = columnEnds.findIndex((end) => end <= event.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMin);
    } else {
      columnEnds[column] = event.endMin;
    }
    return { event, column, columns: 1 };
  });

  const parent = placed.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const union = (a: number, b: number) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].event;
      const b = placed[j].event;
      if (a.startMin < b.endMin && a.endMin > b.startMin) union(i, j);
    }
  }

  const clusters = new Map<number, LaidOutEvent<T>[]>();
  placed.forEach((item, index) => {
    const root = find(index);
    const list = clusters.get(root) ?? [];
    list.push(item);
    clusters.set(root, list);
  });

  clusters.forEach((items) => {
    const columns = Math.max(...items.map((item) => item.column)) + 1;
    items.forEach((item) => {
      item.columns = columns;
    });
  });

  return placed;
}
