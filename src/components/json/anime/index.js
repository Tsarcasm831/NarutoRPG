import A from './A.json' assert { type: 'json' };
import B from './B.json' assert { type: 'json' };
import C from './C.json' assert { type: 'json' };
import D from './D.json' assert { type: 'json' };
import E from './E.json' assert { type: 'json' };
import F from './F.json' assert { type: 'json' };
import G from './G.json' assert { type: 'json' };
import H from './H.json' assert { type: 'json' };
import I from './I.json' assert { type: 'json' };
import J from './J.json' assert { type: 'json' };
import K from './K.json' assert { type: 'json' };
import L from './L.json' assert { type: 'json' };
import M from './M.json' assert { type: 'json' };
import N from './N.json' assert { type: 'json' };
import O from './O.json' assert { type: 'json' };
import P from './P.json' assert { type: 'json' };
import Q from './Q.json' assert { type: 'json' };
import R from './R.json' assert { type: 'json' };
import S from './S.json' assert { type: 'json' };
import T from './T.json' assert { type: 'json' };
import U from './U.json' assert { type: 'json' };
import V from './V.json' assert { type: 'json' };
import W from './W.json' assert { type: 'json' };
import Y from './Y.json' assert { type: 'json' };

export const animeByLetter = {
  A: A.items,
  B: B.items,
  C: C.items,
  D: D.items,
  E: E.items,
  F: F.items,
  G: G.items,
  H: H.items,
  I: I.items,
  J: J.items,
  K: K.items,
  L: L.items,
  M: M.items,
  N: N.items,
  O: O.items,
  P: P.items,
  Q: Q.items,
  R: R.items,
  S: S.items,
  T: T.items,
  U: U.items,
  V: V.items,
  W: W.items,
  Y: Y.items
};

export const allAnime = Object.values(animeByLetter).flat();
