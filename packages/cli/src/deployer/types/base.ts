import * as fs from 'fs';
import { sync as globSync } from 'glob';
import { ComponentDeployer } from '../ComponentDeployer';

const getIdComponent = (det: any): string => {
    return `${det.vendor}:${det.nss}:${det.version}`;
};

export abstract class BaseTypesDeployer implements ComponentDeployer {

    protected abstract async getServerEntities(): Promise<any>;
    public abstract async clean(location: string): Promise<any>;
    public abstract async deploy(location: string): Promise<any>;
    protected abstract log(...args: any): void;

    protected async traverse(
        location: string,
        fileFilter: (file: string) => boolean,
        visitor: (det: any, existingDet?: any
    ) => Promise<any>) {
        const files = globSync(location).filter(fileFilter);
        const serverEntities = await this.getServerEntities();
        const existingDets = serverEntities.body.values
            .reduce((prev: any, curr: any) => {
                prev[getIdComponent(curr)] = curr;
                return prev;
            }, {});
        this.log(existingDets);
        return Promise.all(
            files.map(async file => {
                this.log(`Loading defined entity type from file: ${file}`);
                const det = JSON.parse(fs.readFileSync(file).toString());
                const existingDet = existingDets[getIdComponent(det)];
                return visitor(det, existingDet).catch(e => this.log(e));
            })
        );
    }
}
