class router {
    constructor() {
        this.router = new Map();
        this.router.set("GET", "/api/v1/chat/completions", this.getChatCompletions);
    }
    getChatCompletions(req: any, res: any) {{
        
    }
}