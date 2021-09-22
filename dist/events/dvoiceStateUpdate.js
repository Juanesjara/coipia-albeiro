module.exports = (oldState, newState) => {
    var _a, _b;
    console.log(arguments);
    // if nobody left the channel in question, return.
    if (oldState.channelID !== ((_a = oldState.guild) === null || _a === void 0 ? void 0 : _a.me.voice.channelID) || newState.channel)
        return;
    // otherwise, check how many people are in the channel now
    /*    console.log("oldsate",oldState.channel)
       console.log("oldsate",oldState.guild)
   
       console.log("new",newState.channel)
       console.log("new",newState.guild) */
    if (!((_b = oldState.channel) === null || _b === void 0 ? void 0 : _b.members.size) - 1)
        setTimeout(() => {
            if (!oldState.channel.members.size - 1) // if there's still 1 member, 
                oldState.channel.leave(); // leave
        }, 300000); // (5 min in ms)
};
//# sourceMappingURL=dvoiceStateUpdate.js.map