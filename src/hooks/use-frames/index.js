import useAPI from '../use-api';
import useProgress from '../use-progress';

import { BASE_PATH_PROJECTS } from '../../utils/constants';

const getRangeFor = frames => {
  if (!frames || !frames.length) return;
  return `frames=${frames.map(frame => `${frame}-${frame}`).join(',')}`;
};

const useFrames = (accession, frames, atomsPerFrame, projection) => {
  const range = getRangeFor(frames);

  const { loading, payload, error, previousPayload, response } = useAPI(
    frames.length &&
      atomsPerFrame &&
      `${BASE_PATH_PROJECTS}${accession}/files/trajectory${
        Number.isFinite(projection) ? `.pca-${projection + 1}` : ''
      }.bin`,
    { bodyParser: 'arrayBuffer', range },
  );

  const progress = useProgress(response);

  return {
    loading,
    frameData: payload,
    error,
    previousFrameData: previousPayload,
    progress,
  };
};

export default useFrames;
