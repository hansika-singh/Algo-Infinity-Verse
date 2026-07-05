function simulatePerl(code){

    const output = [];
    const errors = [];

    if(!code.trim()){
        errors.push("No code to execute.");
        return {output,errors};
    }

    const vars = {};

    const lines = code.split("\n");

    for(let line of lines){

        line = line.trim();

        if(
            !line ||
            line.startsWith("#") ||
            line.startsWith("sub")
        ){
            continue;
        }

        // my $name = "Lakshay";
        let match = line.match(
            /^my\s+\$(\w+)\s*=\s*(.+);$/
        );

        if(match){

            let [,name,value] = match;

            value = value.trim();

            if(
                value.startsWith('"') &&
                value.endsWith('"')
            ){
                vars[name] = value.slice(1,-1);
            }
            else if(!isNaN(value)){
                vars[name] = Number(value);
            }

            continue;
        }

        // print
        match = line.match(
            /^print\s+(.+);?$/
        );

        if(match){

            let expr = match[1];

            expr = expr
                .replace(/\$(\w+)/g,
                    (_,v)=>vars[v] ?? ""
                )
                .replace(/^"/,"")
                .replace(/"$/,"")
                .replace(/\\n/g,"\n");

            output.push(expr);
        }
    }

    if(
        output.length===0 &&
        errors.length===0
    ){
        errors.push(
          "Notice: Script produced no output."
        );
    }

    return {output,errors};
}
