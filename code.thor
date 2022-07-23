import fs



fn read(path) -> readTextFile(path)

future = fork {
    while boomerMemesFunny() {
        response = yield "lol"
    }
}

future.resolve("not funny nomore")
future.yield("haha") //
future.reopen() //contravertial
future.isResolved

sin(90°)

color(0,0,0); //rgba
color(90deg,50bright,50saturation)

90deg



(0 + 1i) * 90° -> -1

(2, π) * 27°

0deg - 180deg = 180deg

ofFullRotation(5/6)

ofFullRotation(90/360);

CustomNumber{}

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
BigUint64Array



Number{
    nomDP:1
    denomDP:1
    nom:"53"
    deom:"74"
}




future.await()

f(x) = 2x

fn Fifo(infifo,len){
    return fork fifoOut{
        fifoOut.write();


    }

}

Result(%gotdata,"somedata👾");

:
arr = [1,2,3,4,5]
arr[1:3] -> [2, 3]
for x in 1:3 {
    print(x) -> 2, 3
}
let x = 🔢

sym ok from 👌

%symbol


thisRatio = 7 / 9 // <- no bitches??

let well = WishingWell()
let promise = well.wish(7)
let wish = await promise
if(wish.granted) {
    print("YESSSSS")
} else {
    print("cry.")
}


while doesntMatter(yourOpinion) == true or fax() {
    get(Some("bitches"))
}



fn among(who: str): bool {
    print("among {who}")
    return true
}
among("us")
//lol

// ??
import gl



never() //waits forever

future.isResolved //is it "resolved", cannot send more data, closed, thread finished if connected

future.await() //awaits resolution, returns result

thread.pause() //makes a thread stop execution
thread.resume() //makes a thread resume execution

future.resolve(result); //finalizes, declares result, stops connected thread

//awaits until both ends unlocked and return the value from the other end
//aditional calls after said end has been blocked results in only result.resolved: true being returned;
//after resolution calling eather end sends a Resolved signal
//adv versions send moreData's properties into the Result
future.read(forWriteEnd);
future.readAdv(moreData)
future.write(forReadEnd,moreData);
future.writeAdv(moreData)




//moreData.final tells the receving end to finish the communication, does not send value
//moreData.k tells the receving end the data's key in its original structure
//moreData.value tells the receving end the communicated value (only key sent by future.read and future.write)
//moreData.resolved is true if the ends are resolved and cannot send data
//when moreData.nowait is true the sender does not care about consistant data transmission but unblocks the other side

MySQL vs YourSQL vs TheirSQL vs OurSQL vs Yall'sSQL

fifo(inFut,outFut){
    fifo awaitDry

    bank = fifoBank()
    alive = true

    fork awaitDry never()

    fork {
        fifoBank.give(inFut.read())
        awaitDry.writeAdv({nowait:true});
        if !alive return;
    }
    fork {
        if fifoBank.hasData() {
            outFut.write(fifoBank.get())
        } else awaitDry.read();
        if !alive return;
    }
    return fork fifo {
        readdata
        while true {
           readdata = fifo.readAdv(readdata)
           if readdata.finalize {
            alive = false
            awaitDry.resolve()
           }   
        }
    }
}


fork demo{
    
    when demo "write" {

    }

    l = fork action();
    //mabe add "also when" keyword
    when demo "close" { //if "close" happens
        l.close()
        demo.hault()
    }
    answer = until l "resolve"
    //until will run the rest if "resolve" happens
    return answer
}

demo.do("close") //oops its early i guess



fork demo2 asyncAction()
await demo2



s = cerial({ x: 20 }) -> "{\"x\":20}"
decerial(s) -> { x: 20 }

fun_fact("I love lean (code)")

silo = "🌾-<"

let 猫 = "neko"

// 👌 locale support??
locale "ja"

// コンセルに単語を話す
言う(メーセージ: ステリング): ボイド {
    プリント("君は「{メーセージ}」って言っている")
}

locale "en"

sb = Starbucks()
sb.mangoDragonFruit(Size.Grande)
sb.pinkDrink(Size.Venti)

// リーンが好きだ。マンゴーヅラゴンフルトですぐ今飲みたい。とてもベードに寝たい！！

fn love(thing: str) {
    print("I love {thing}")
}
love("LEAN!!!!! 💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜💜")

future.return();



 
 
fn name(x: str): int? {
    if x == "": return None
    return Some(x.len())
}

bar = future.give("foo");


foo = future.take("bar");

import serve from http

for await request in serve(3000) {
    request.give( "Hello, world!" )
    
}




future = fork {
   
    

}



for x in 1:10 {
    print(x)
}
// SAME AS...
arr = [1,2,3,4,5,6,7,8,9]
for x in arr {
    print(x)
}

fn say(message: str): str {
    print(message)
    return message
}
say("y") // good 😎
say(0) // fails 😭

....

result = await future
result = await future
result = await future
result = await future



print(read("./code.thor"))