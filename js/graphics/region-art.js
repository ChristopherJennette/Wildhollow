// Landmark and mountain silhouettes are cached by SpriteManager, just like trees.
export function paintRegionObject(c, shape) {
  const polygon = (points, fill, stroke = '#48524b') => {
    c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = stroke; c.lineWidth = 1; c.stroke();
  };
  if (shape === 'mountain') {
    polygon([[-68,0],[-28,-102],[8,-140],[72,-7],[12,25]], '#6c776e');
    polygon([[8,-140],[72,-7],[12,25],[-8,-34]], '#495b57');
    polygon([[-12,-108],[8,-140],[29,-101],[12,-109],[3,-92]], '#b5b8a1');
    polygon([[-68,0],[-28,-102],[-8,-34],[12,25]], '#788176');
    return true;
  }
  if (shape === 'ruin') {
    polygon([[-28,4],[-28,-38],[-17,-43],[-17,-29],[-5,-33],[-5,-17],[11,-22],[11,15]], '#9c9a7c');
    polygon([[11,15],[11,-22],[24,-30],[24,8]], '#626e61');
    for (let y = -25; y < 5; y += 10) { c.strokeStyle='#666f5d';c.beginPath();c.moveTo(-26,y);c.lineTo(10,y+12);c.stroke(); }
    polygon([[-30,7],[-21,0],[-11,9],[-20,14]], '#78816a');
    return true;
  }
  if (shape === 'standingStone') {
    polygon([[-13,6],[-10,-53],[2,-64],[13,-52],[13,6],[0,12]], '#8b9780');
    polygon([[2,-64],[13,-52],[13,6],[0,12],[3,-45]], '#576c61');
    c.strokeStyle='#d1c999';c.lineWidth=2;c.beginPath();c.moveTo(-3,-38);c.lineTo(5,-31);c.lineTo(-3,-23);c.stroke();
    return true;
  }
  if (shape === 'tent') {
    polygon([[-45,9],[-8,-48],[47,1],[8,25]], '#9b8f63');
    polygon([[-45,9],[-8,-48],[8,25]], '#beb17d');
    polygon([[-30,13],[-8,-29],[-3,21]], '#303e33');
    return true;
  }
  return false;
}
