import stages from './routineStages';
import { PROMISE_ACTION } from './constants';

const noop = () => undefined;
const identity = i => i;

export default function createRoutine(routineName = '', payloadCreator = identity, defaultAction = 'form') {
  if (typeof routineName !== 'string') {
    throw new Error('Invalid routine name, it should be a string');
  }
  if (typeof defaultAction !== 'string') {
    defaultAction = '';
  }

  const routineParams = stages.reduce((result, stage) => {
    const stageActionType = `${routineName}_${stage}`;
    const stageActionCreator = (payload) => ({
      type: stageActionType,
      payload: payloadCreator(payload),
    });
    stageActionCreator.ACTION_TYPE = stageActionType;

    return Object.assign(result, {
      [stage]: stageActionType,
      [stage.toLowerCase()]: stageActionCreator,
    });
  }, {});

  const createPromiseActionCreator = (reduxFormFallback) => {
    return (data, dispatch) => {
      return new Promise((resolve, reject) => dispatch({
        type: PROMISE_ACTION,
        payload: {
          data,
          params: routineParams,
          defer: { resolve, reject },
          reduxFormFallback,
        },
      }));
    }
  };

  routineParams.promise = createPromiseActionCreator(false);
  routineParams.form = createPromiseActionCreator(true);

  const routine = routineParams[defaultAction.toLowerCase()] || noop;

  return Object.assign(routine, routineParams);
}
