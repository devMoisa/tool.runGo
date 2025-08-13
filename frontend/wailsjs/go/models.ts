export namespace app {
	
	export class CodeExample {
	    id: string;
	    title: string;
	    description: string;
	    category: string;
	    code: string;
	    instruction: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new CodeExample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.code = source["code"];
	        this.instruction = source["instruction"];
	        this.tags = source["tags"];
	    }
	}

}

export namespace config {
	
	export class Config {
	    goPath: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.goPath = source["goPath"];
	    }
	}

}

