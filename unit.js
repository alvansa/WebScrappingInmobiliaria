const fs = require('fs');

function main(){
    if (fs.existsSync('test_user_agent.json')) fs.unlinkSync('test_user_agent.json');
    fs.appendFileSync('test_user_agent.json', '[');
    for(let i = 2; i < 2974; i++){
        
        if(fs.existsSync(`test_user_agent_${i}.txt`)){
            const line = fs.readFileSync(`test_user_agent_${i}.txt`, "utf-8").trim();
            const userAgent = line.split(': ')[1];
            fs.appendFileSync(`test_user_agent.json`, `"${userAgent}",\n`);

            console.log(userAgent);
        }
    }
    fs.appendFileSync('test_user_agent.json', ']');
}

main();