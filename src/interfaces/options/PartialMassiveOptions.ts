import RequestOptions from './RequestOptions';
import MassiveOptions from './MassiveOptions';
import WithOptional from '../util/WithOptional';

type OptionalKeys = keyof RequestOptions | keyof Omit<MassiveOptions, 'values'>;

type PartialMassiveOptions = WithOptional<MassiveOptions, OptionalKeys>;

export default PartialMassiveOptions;