import type RequestOptions from './RequestOptions';
import type MassiveOptions from './MassiveOptions';
import type WithOptional from '../util/WithOptional';

type OptionalKeys = keyof RequestOptions | keyof Omit<MassiveOptions, 'values'>;

type PartialMassiveOptions = WithOptional<MassiveOptions, OptionalKeys>;

export default PartialMassiveOptions;
