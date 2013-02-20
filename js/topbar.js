define(["canvas", "easing"], function(Canvas) {
    var color = "rgba(0, 0, 0, 0.7)",
        height = 30;

    return function(items) {
        var topbar = {
            items: items,
            draw: function() {
                Canvas.context.save();
                Canvas.context.font = "22px Arial";
                Canvas.context.lineWidth = 1;
                Canvas.context.fillStyle = color;
                Canvas.context.strokeStyle = "white";
                Canvas.context.fillRect(0, 0, Canvas.width, height);
                Canvas.context.beginPath();
                Canvas.context.moveTo(0, height);
                Canvas.context.lineTo(Canvas.width, height);
                Canvas.context.stroke();
                Canvas.context.fillStyle = "white";
                Canvas.context.textAlign = "center";
                Canvas.context.textBaseline = "middle";
                for(var i = 0; i < topbar.items.length; i++) {
                    var x = Canvas.width / topbar.items.length * i + (Canvas.width / topbar.items.length / 2);
                    Canvas.context.fillText(topbar.items[i].name + ": " + topbar.items[i].obj[topbar.items[i].prop] , x, height / 2);    
                }
                
                Canvas.context.restore();                
            }
        };
        return topbar;
    };
});